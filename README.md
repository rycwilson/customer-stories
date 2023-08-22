## [Customer Stories Platform (CSP)](https://customerstories.net)

<hr>

### Table of Contents

#### Features
- [Import CRM Data](#import)
- [Crowdsource Content](#crowdsource)
- [Publish](#publish)
- [Promote](#promote)
- [Measure](#measure)
- [Website Plugin](#website-plugin)

#### Deployment

- [DNSimple](#dnsimple)
- [Heroku](#heroku)
- [SSL Certificates](#ssl-certificates)
- [Database](#database)

#### Development
- [Installation](#installation)
- [Testing](#testing)
- [Notes](#notes)

#### Services
- [Clicky](#clicky)
- [AWS S3](#aws-s3)
- [SendGrid](#sendgrid)
- [Zapier](#zapier)
- [Google Ads](#google-ads)
- [Heroku Scheduler](#heroku-scheduler)

<hr>

<!-- <a name="features"></a> -->

### Features 

<a name="import"></a>

#### Import CRM Data
- import with CSV file or Zapier
- or create anew
- LinkedIn badges

<a name="crowdsource"></a>

#### Crowdsource Content
- Templates: default, custom
- Invite Contributors
- Contributor Questions
- Contributor Answers
- Inserting contributor content

<a name="publish"></a>

#### Publish
- Customer Story anatomy: highlighted customer quote, customer results, narrative (HTML editor), more info
- publish levels: logo, preview, story, etc
- CTAs
- Sharing
- SEO

<a name="promote"></a>

#### Promote
- Google Ads
- NOTE that ad blockers may detect Google markup on the ads preview page and block content. The page only mimics Google Ads content and does not load anything from Google. Disable your ad blocker to ensure all content loads

<a name="measure"></a>

#### Measure
- charts and tables

<a name="website-plugin"></a>

#### Website Plugin 
- multiple types
- fully featured story overlays

<!-- <a name="development"></a> -->

<hr>

### Deployment

<a name="dnsimple"></a>

#### DNSimple

<a name="heroku"></a>

#### Heroku
- [Staging dashboard](https://dashboard.heroku.com/apps/csp-staging)
- [Production dashboard](https://dashboard.heroku.com/apps/floating-spire-2927)
- Both staging and production use hobby [dynos](https://devcenter.heroku.com/categories/dynos) 
- Environment variables / API keys: figaro, application.yml, apply to heroku
- common CLI commands
- env variables / api keys
- Heroku doesn't like A-records, may lead to instability in DNS resolution
	- [The Limitations of DNS A-Records](https://devcenter.heroku.com/articles/apex-domains)
	- [Stack Overflow](http://stackoverflow.com/questions/13478008/heroku-godaddy-naked-domain), [Stack Overflow](http://stackoverflow.com/questions/11492563/heroku-godaddy-send-naked-domain-to-www), [Stack Overflow](http://stackoverflow.com/questions/16022324/how-to-setup-dns-for-an-apex-domain-no-www-pointing-to-a-heroku-app)

<a name="ssl-certificates"></a>

#### SSL Certificates
- Heroku [does not support](https://devcenter.heroku.com/articles/automated-certificate-management) wildcard SSL certificates (needed for subdomains)
- Certificates created with [certbot](https://certbot.eff.org/)
  - assuming a macOS environment
  - contact Ryan for DNSimple credentials (`certbot-creds.ini` file)
  1. `sudo pip3 install certbot`
  2. `sudo pip3 install certbot-dns-dnsimple` 
  3. For any other DNS registrars, need to install the corresponding [DNS plugin](https://eff-certbot.readthedocs.io/en/stable/using.html#dns-plugins). Run `certbot plugins` to check.
  4. Create the wildcard certificate:
    `sudo certbot certonly --dns-dnsimple --dns-dnsimple-credentials ./certbot-creds.ini -d 'customerstories.org' -d '*.customerstories.org'`
  5. The certificate is placed in `/etc/letsencrypt/live/customerstories.org`. Subsequent renewals will overwrite this directory.
  6. The above folder has super user permissions. You can make a copy (`sudo cp -r /etc/letsencrypt/live/customerstories.org .`) and then change permissions on the directory (`sudo chown -R username customerstories.org`). Now you can cd into the directory.
  7. Upload to heroku: `heroku certs:add fullchain.pem privkey.pem -a [csp-staging|floating-spire-2927]`
  8. Check the certificate with `heroku certs -a [csp-staging|floating-spire-2927]` or under Settings in the app dashboard

<a name="database"></a>

#### Database
Copy the production database to staging:
  - Assumes `staging` is a remote repo on heroku corresponding to customerstories.org. Also works: `-a csp-staging`
  - Assumes the primary database (as indicated by `DATABASE_URL` in the heroku configuration) on production is being copied to the primary database on staging. If copying to/from another db, make sure to use the correct name instaed of `DATABASE_URL`
  - To find database names: `heroku pg:info -a [csp-staging|floating-spire-2927]`
  1. Turn off the web dynos on staging: `heroku maintenance:on -r staging`
  2. Turn off worker dynos (if any): `heroku ps:scale worker=0 -r staging`
  3. `heroku pg:copy floating-spire-2927::DATABASE_URL DATABASE_URL -r staging`
  4. `heroku maintenance:off -r staging`
  5. `heroku ps:scale worker=1 -r staging` (or however many workers, if any)

Copy the production database to local:
  - First must drop the local db: `bundle exec rails db:drop`
  - `heroku pg:pull DATABASE_URL csp_development -r production` 
  - `RAILS_ENV=development bundle exec rails db:environment:set`

#### Caching
There were some issues with caching when upgrading to Rails 6. To minimize complexity caching (mostly in the form of rails low-level caching) has been disabled on staging and production.

#### SEO
- json/ld in `app/views/stories/index/seo_meta_tags.html` and `app/views/stories/show/seo_meta_tags.html`
- [Google Search Console](https://search.google.com/u/2/search-console/not-verified?original_url=/search-console/r/unknown-type/drilldown&original_resource_id)


<hr>

### Development

#### Installation
- System dependencies: Ruby 3.1.2, PosgresSQL@14, [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli), [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- Clone repo
- Set up DB
- install dependencies
- Add heroku remotes

<a name="testing"></a>

#### Testing
- Not enough!
- zapier: google sheets
- csv import

<a name="notes"></a>

#### Notes
- AWS S3: buckets, CORS
- local tunneling with ngrok
- plugin JSONP
- file/image upload: aws s3, CORS
- copying production database
- account customization: stylesheets etc

<hr>

### Services
- for all: username(s), password, account tier, api keys

<a name="clicky"></a>

#### Clicky
- models (`VisitorSession`, `Visitor`, `VisitorAction`, `PageView`, `StoryShare`)
- tasks
- updates presently disabled

<a name="aws-s3"></a>

#### AWS S3/Cloudfront
- [Console](https://us-west-1.console.aws.amazon.com/console/home?region=us-west-1)
- A separate user `csp-user` is used to generate credentials for interacting with the S3 bucket from the application. See the [IAM Management Console](https://us-east-1.console.aws.amazon.com/iamv2/home?region=us-east-1#/users).
- In the [production S3 bucket](https://s3.console.aws.amazon.com/s3/buckets/csp-prod-assets?region=us-west-1&tab=objects&tab=permissions), note the bucket policy which is necessary for the [Cloudfront distribution](https://us-east-1.console.aws.amazon.com/cloudfront/v3/home?region=us-west-1#/distributions/E3F8UC3PNEEQNK/origins) to read from the bucket, and the CORS list which is necessary for user uploads and font requests.
- Public access to the production S3 bucket (used by both `.org` and `.net`) is blocked, however since the development environment does not request assets through Cloudfront, public access to the [development S3 bucket](https://s3.console.aws.amazon.com/s3/buckets/csp-dev-assets?region=us-west-1&tab=permissions) must be turned on. The bucket policy ensures only requests from development domains are allowed.
- For the Cloudfront distribution, the only additional steps beyond creating the distribution (and accepting default values) were 
  - [Creating the origin access control](https://us-east-1.console.aws.amazon.com/cloudfront/v3/home?region=us-west-1#/originAccess) via [these steps](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
  - [Editing the default behavior](https://us-east-1.console.aws.amazon.com/cloudfront/v3/home?region=us-west-1#/distributions/E3F8UC3PNEEQNK/behaviors/0/edit) to include Origin headers in the cache key (required for subdomains)


<a name="sendgrid"></a>

#### SendGrid
- read receipts
- limits

<a name="zapier"></a>

#### Zapier
- Customer Stories app
- test spreadsheets

<a name="google-ads"></a>

#### Google Ads
- models (AdwordsCampaign, AdwordsAdGroup, AdwordsAd, AdwordsImage)
- configuration (search/keywords, topic, retarget)

<a name="heroku-scheduler"></a>

#### Heroku Scheduler
- send invitation reminders
- download clicky data (disabled)
- clean adwords images (disabled)

###### TODO: connect to video accounts YouTube, Vimeo, Wistia