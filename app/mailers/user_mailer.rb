class UserMailer < ApplicationMailer

  default from: 'noreply@customerstories.net'

  def cron_email()
    mail(to: '***REMOVED***', subject: 'testing cron emailer')
  end

  def request_contribution contribution, curator
    # TODO: how to set curator if email sent via cron job?
    #  i.e. curator not necessarily logged in
    #  is curator data captured in the cron job?
    @curator = curator
    @company = Company.find @curator.company_id
    @contributor = User.find contribution.user_id
    # eventually Users will be role-based STI,
    #   contributor will have a customer_id
    #   => @customer = Customer.find @contributor.customer_id
    # for now:
    @customer = Customer.find contribution.success.customer_id
    @contribution_url = "http://#{ENV['HOST']}/contributions/#{contribution.id}/contribution"
    @feedback_url = "http://#{ENV['HOST']}/contributions/#{contribution.id}/feedback"
    @opt_out_url = "http://#{ENV['HOST']}/contributions/#{contribution.id}/opt_out"
    binding.pry

    mail to: @contributor.email, subject: "Participate in a #{@customer.name} / #{@company.name} success story"

  end

end
