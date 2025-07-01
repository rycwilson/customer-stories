## [Customer Stories Platform (CSP)](https://customerstories.net)

Customer Stories is a multi-tenant B2B marketing automation platform that provides tools for crowdsourcing, curating, publishing, promoting, and analyzing the reach and audience of customer success stories. The typical target user is a client company's Customer Reference Program Manager.

<hr>

### Table of Contents

#### Features
- [Import CRM Data](#import)
- [Crowdsource Content](#crowdsource)
- [Publish](#publish)
- [Promote](#promote)
- [Measure](#measure)
- [Website Plugin](#website-plugin)

#### Development
- [Installation](#installation)
- [Testing](#testing)
- [Notes](#notes)

#### Services
- [Clicky](#clicky)
- [AWS S3/Cloudfront](#aws-s3)
- [AWS SES](#aws-ses)
- [Zapier](#zapier)
- [Google Ads](#google-ads)

<hr>

<!-- <a name="features"></a> -->

### Features 

<a name="import"></a>

#### Import CRM Data
- Import with CSV file or Zapier
- Manual data entry also available

<a name="crowdsource"></a>

#### Crowdsource Content
- Invite contributors with factory-suggested or custom email templates
- Assign contributor prompts/questions to templates
- Import responses directly into stories

<a name="publish"></a>

#### Publish
- Customer Story components: highlighted customer quote, video, highlighted metrics/results, story narrative (crafted via HTML WYSIWYG), call-to-action links/forms, related stories
- Stories on company page (e.g. `https://exampleinc.customerstories.net`) are searchable and filterable via category and product tags
- Publish levels: logo, preview, story
- Social media sharing
- SEO

<a name="promote"></a>

#### Promote
- Published stories automatically uploaded to Google Ads
- Enable/pause ads via dashboard panel
- NOTE that ad blockers may detect Google markup on the ads preview page and block content. The page only mimics Google Ads content and does not load anything from Google. Disable your ad blocker to ensure all content loads

<a name="measure"></a>

#### Measure
- Track visitors to stories over time
- Track source of visit (promotion, direct link, etc)
- Monitor recent activity, including new/imported data 
- Google Charts

<a name="website-plugin"></a>

#### Website Plugin 
- Multiple configurable types: grid, carousel, tabbed carousel
- Customize featured stories

<!-- <a name="development"></a> -->

<hr>

### Development

#### Required software
- postgreql
- node
- yarn
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

<a name="testing"></a>

#### Testing

<hr>

### Services

<a name="clicky"></a>

#### Clicky
- models: `Visitor`, `VisitorSession`, `VisitorAction`, `PageView`, `StoryShare`
- Regular updates via Heroku Scheduler and rake tasks are no longer active

<a name="aws-s3"></a>

#### AWS S3/Cloudfront
- [Console](https://us-west-1.console.aws.amazon.com/console/home?region=us-west-1)
- A separate user `csp-user` is used to generate credentials for interacting with the S3 bucket from the application. See the [IAM Management Console](https://us-east-1.console.aws.amazon.com/iamv2/home?region=us-east-1#/users).
- In the [production S3 bucket](https://s3.console.aws.amazon.com/s3/buckets/csp-prod-assets?region=us-west-1&tab=objects&tab=permissions), note the bucket policy which is necessary for the [Cloudfront distribution](https://us-east-1.console.aws.amazon.com/cloudfront/v3/home?region=us-west-1#/distributions/E3F8UC3PNEEQNK/origins) to read from the bucket, and the CORS list which is necessary for user uploads and font requests.
- Public access to the production S3 bucket (used by both `.org` and `.net`) is blocked, however since the development environment does not request assets through Cloudfront, public access to the [development S3 bucket](https://s3.console.aws.amazon.com/s3/buckets/csp-dev-assets?region=us-west-1&tab=permissions) must be turned on. The bucket policy ensures only requests from development domains are allowed.
- For the Cloudfront distribution, the only additional steps beyond creating the distribution (and accepting default values) were 
  - [Creating the origin access control](https://us-east-1.console.aws.amazon.com/cloudfront/v3/home?region=us-west-1#/originAccess) via [these steps](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
  - [Editing the default behavior](https://us-east-1.console.aws.amazon.com/cloudfront/v3/home?region=us-west-1#/distributions/E3F8UC3PNEEQNK/behaviors/0/edit) to include Origin headers in the cache key (required for subdomains)


<a name="aws-ses"></a>

#### AWS SES

<a name="zapier"></a>

#### Zapier
- Customer Stories app
- test spreadsheets

<a name="google-ads"></a>

#### Google Ads
- models: `AdwordsCampaign`, `AdwordsAdGroup`, `AdwordsAd`, `AdwordsImage`

<a name="heroku-scheduler"></a>