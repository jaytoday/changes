import React, { PropTypes } from 'react';

import APINotLoaded from 'es6!display/not_loaded';
import { InfoList, InfoItem } from 'es6!display/info_list';

import * as api from 'es6!server/api';

import * as utils from 'es6!utils/utils';

var DetailsTab = React.createClass({

  propTypes: {
    // the API response from the fetch below
    details: PropTypes.object,
    // the project api response
    project: PropTypes.object,
  },

  componentDidMount: function() {
    var slug = this.props.project.getReturnedData().slug;
    api.fetch(this.props.pageElem, {
      details: `/api/0/projects/${slug}/plans/`
    });
  },

  render: function() {
    if (!api.isLoaded(this.props.details)) {
      return <APINotLoaded state={this.props.details} />;
    }

    var plans = this.props.details.getReturnedData();
    var project = this.props.project.getReturnedData();

    var markup = _.map(plans, p =>
      <div className="marginBottomL">
        <b className="block">Build Plan:{" "}{p.name}</b>
        <InfoList>
          <InfoItem label="Infrastructure">
            {!_.isEmpty(p.steps) && p.steps[0].name}
          </InfoItem>
          <InfoItem label="Timeout">
            {!_.isEmpty(p.steps) && p.steps[0].options['build.timeout']}
          </InfoItem>
          <InfoItem label="Config:">
            <span />
          </InfoItem>
        </InfoList>
        <pre className="defaultPre">
          {!_.isEmpty(p.steps) && p.steps[0].data}
        </pre>
      </div>
    );

    return <div>
      {this.renderHeader(project, plans)}
      {markup}
    </div>;
  },

  renderHeader: function(project, plans) {
    var builds_on_diffs = project.options["phabricator.diff-trigger"];
    var builds_on_commits = project.options["build.commit-trigger"];

    var triggers = 'Does not automatically run';
    if (builds_on_commits && builds_on_diffs) {
      triggers = 'Diffs and Commits';
    } else if (builds_on_diffs) {
      triggers = 'Only diffs';
    } else if (builds_on_commits) {
      triggers = 'Only commits';
    }

    var branches_option = project.options["build.branch-names"] || '*';
    var branches = branches_option === "*" ?
      'any' :
      branches_option.replace(/ /g, ", ");

    var whitelist_option = project.options["build.file-whitelist"].trim();
    var whitelist_paths = 'No path filter';
    if (whitelist_option) {
      whitelist_paths = _.map(utils.split_lines(whitelist_option), line => {
        <div>{line}</div>
      });
    }

    return <div className="marginBottomL">
      <b>{project.name}</b>
      <InfoList>
        <InfoItem label="Repository">
          {project.repository.url}
        </InfoItem>
        <InfoItem label="Builds for">
          {triggers}
        </InfoItem>
        <InfoItem label="On branches">
          {branches}
        </InfoItem>
        <InfoItem label="Touching paths">
          {whitelist_paths}
        </InfoItem>
        <InfoItem label="Build plans">
          {plans.length}
        </InfoItem>
      </InfoList>
    </div>;

    // TODO: how many tests? how many commits in the last week?
  }
});

export default DetailsTab;