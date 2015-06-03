#!/usr/bin/env python

from __future__ import absolute_import, print_function

import logging

from datetime import date, timedelta

from changes.config import db
from changes.db.utils import try_create
from changes.lib.flaky_tests import get_flaky_tests
from changes.models import FlakyTestStat, Project
import urllib2


def log_metrics(key, **kws):
    try:

        urllib2.urlopen(
            "https://www.dropbox.com/build_metrics" +
            "?key=%s" % key +
            "".join(
                "&%s=%s" % (urllib2.quote(str(k)), urllib2.quote(str(v)))
                for (k, v) in kws.items()
            )
        ).read()
    except Exception as e:
        print("Logging Failed", e)
        pass


def aggregate_flaky_tests(day=None, max_flaky_tests=200):
    if day is None:
        day = date.today() - timedelta(days=1)

    try:
        projects = Project.query.all()

        for project in projects:
            tests = get_flaky_tests(day, day + timedelta(days=1), [project], max_flaky_tests)

            for test in tests:
                log_metrics(
                    "flaky_test_reruns",
                    flaky_test_reruns_name=test['name'],
                    flaky_test_reruns_project_id=test['project_id'],
                    flaky_test_reruns_flaky_runs=test['flaky_runs'],
                    flaky_test_reruns_passing_runs=test['passing_runs'],
                )
                try_create(FlakyTestStat, {
                    'name': test['name'],
                    'project_id': test['project_id'],
                    'date': day,
                    'last_flaky_run_id': test['id'],
                    'flaky_runs': test['flaky_runs'],
                    'passing_runs': test['passing_runs']
                })

        db.session.commit()
    except Exception as err:
        logging.exception(unicode(err))
