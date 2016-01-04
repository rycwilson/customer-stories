# Use this file to easily define all of your cron jobs.
#
# It's helpful, but not entirely necessary to understand cron before proceeding.
# http://en.wikipedia.org/wiki/Cron

# require the application
require "./"+ File.dirname(__FILE__) + "/environment.rb"

# Example:
#
set :output, "path/log/cron.log"
#
# every 2.hours do
#   command "/usr/bin/some_great_command"
#   runner "MyModel.some_method"
#   rake "some:great:rake:task"
# end
#
# every 4.days do
#   runner "AnotherModel.prune_old_records"
# end

# Learn more: http://github.com/javan/whenever

every 5.minutes do

  rake 'email:send_reminders'
#runner 'User.expire_session_cache'
#job_type :rake,    "/home/ubuntu/workspace && RAILS_ENV=development bundle exec /app/mailers/rake  :task --silent :output"
end

