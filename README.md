== README

This README would normally document whatever steps are necessary to get the
application up and running.

Things you may want to cover:

* Ruby version

* System dependencies

* Configuration

* Database creation

* Database initialization

* How to run the test suite

* Services (job queues, cache servers, search engines, etc.)

* Deployment instructions

* ...


Please feel free to use a different markup language if you do not plan to run
<tt>rake doc:app</tt>.

## Heroku
#### Database
To copy from production to staging: 
(this assumes `staging` is a git remote repo)

1. turn off the web dynos in staging: ```heroku maintenance:on -r staging```
2. if there are non-web-dynos, turn them off too: ```heroku ps:scale worker=0 -r staging```
3. copy: ```heroku pg:copy floating-spire-2927::HEROKU_POSTGRESQL_GOLD_URL HEROKU_POSTGRESQL_MAUVE_URL -r staging```
4. (to confirm database names: ```heroku pg:info```)

Turn stuff back on:

1. ```heroku maintenance:off -r staging```
2. ```heroku ps:scale worker=1 -r staging``` (or however many workers, if any)



## Amazon Web Services (AWS)
####Account
- Ryan owns account, Dan has root permissions
- TODO: at what point is it no longer free?

#### Buckets - development and production
- user-uploaded images are in uploads/
- CORS config - new company deployments must be added to the list (dev and prod)
- TODO: script to clean up orphaned files
- TODO: limit image size

#### CLI
- [About](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html)
- installed, next step [configure](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html)

## Hosting / DNS / SSL
<br>
<hr>

#### DNS
- GoDaddy acts as registrar only. Nameservers (set in GoDaddy) point to DNSimple, which manages the DNS records
- DNSimple: For a stable app, give TTL a relatively high value.

####Heroku
- Heroku doesn't like A-records, may lead to instability in DNS resolution
	- [The Limitations of DNS A-Records](https://devcenter.heroku.com/articles/apex-domains)
	- [Stack Overflow](http://stackoverflow.com/questions/13478008/heroku-godaddy-naked-domain), [Stack Overflow](http://stackoverflow.com/questions/11492563/heroku-godaddy-send-naked-domain-to-www), [Stack Overflow](http://stackoverflow.com/questions/16022324/how-to-setup-dns-for-an-apex-domain-no-www-pointing-to-a-heroku-app)
	
####SSL Certificate
- Wildcard certificate for *.customerstories.net purchased from DNSimple
- Files are in ssl/ (.gitignore)
- Staging has a self-signed certificate
- Heroku installation (staging and production) per [Heroku SSL](https://devcenter.heroku.com/articles/ssl-beta)




