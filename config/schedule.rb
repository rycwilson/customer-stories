#
# Whenever must be run through the terminal to modify cron settings:

# whenever -w (from Rails.root) to load schedule.rb into crontab
# whenever -c to clear the crontab

# see log/cron.log for log data

# require the application
require File.expand_path(File.dirname(__FILE__) + '/environment')

# challenge: this adds some paths to the crontab that must be manually removed
# TODO: investigate (see below)
env :PATH, ENV['PATH']

set :output, "#{Rails.root}/log/cron.log"
set :environment, "#{Rails.env}"
set :job_template, "zsh -l -c ':job'"

every :day, at: '7:00 am' do

  # runner 'Contribution.send_reminders'
  rake 'email:send_contribution_reminders'

end

# The env method is appending this PATH varaible to the crontab:
#
# PATH=/Users/wilson/.rbenv/versions/2.2.2/lib/ruby/gems/2.2.0/bin:
#   /Users/wilson/.rbenv/versions/2.2.2/bin:
#   /usr/local/Cellar/rbenv/0.4.0/libexec:

#   the above paths must be manually removed from the crontab!

#   /Users/wilson/.rbenv/shims:
#   /usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin



