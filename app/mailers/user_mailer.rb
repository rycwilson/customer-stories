class UserMailer < ApplicationMailer

  default from: 'no-reply@customerstories.net'

  # TODO: How to handle errors/exceptions for sending email?
  def request_contribution contribution, contributor
    curator = contribution.success.curator
    company = curator.company
    story_example_id = Story.find_example
    # curator_img_path = Rails.application.assets["#{curator.first_name.downcase}.jpg"].pathname.to_s
    template_name = contribution.role + "_request"
    template = company.contribution_emails.where(name:template_name).take
    host = "http://#{ENV['HOST_NAME']}"
    contribution_url = "#{host}/contributions/#{contribution.id}/contribution"
    feedback_url = "#{host}/contributions/#{contribution.id}/feedback"
    opt_out_url = "#{host}/contributions/#{contribution.id}/opt_out"
    story_example_url = "#{host}/stories/#{story_example_id}"
    dan_img_url = "https://s3-us-west-1.amazonaws.com/csp-development-assets/dan.jpg"
    subject = template.subject
                      .sub("[customer_name]", contribution.success.customer.name)
                      .sub("[company_name]", company.name)
    @body = template.body
                    .sub("[customer_name]", contribution.success.customer.name)
                    .sub("[company_name]", company.name)
                    .sub("[contributor_first_name]", contributor.first_name)
                    .sub("[curator_first_name]", curator.first_name)
                    .sub("[contribution_url]", contribution_url)
                    .sub("[feedback_url]", feedback_url)
                    .sub("[curator_full_name]", curator.full_name)
                    .sub("[curator_company]", company.name)
                    .sub("[curator_email]", curator.email)
                    .sub("[curator_phone]", "415-555-7256")
                    .sub("[story_example_url]", story_example_url)
                    .sub("[opt_out_url]", opt_out_url)
                    .sub("[curator_img_url]", dan_img_url)
                    .html_safe

    # sends file ok, but no thumbnail preview.  email settings?
    # ryan = File.expand_path(Rails.root + 'app/assets/images/ryan.jpg')
    # attachments['ryan.jpg'] = File.read(ryan)

    # attachments.inline['ryan.jpg'] = File.read(ryan)

    mail     to: "#{contributor.full_name} <#{contributor.email}>",
           from: "#{curator.full_name} <#{curator.email}>",
        subject: subject

  end

  def contribution_reminder contribution
    # puts "in UserMailer"
    contributor = contribution.user
    curator = contribution.success.curator
    company = curator.company
    if contribution.status == 'request'
      template_name = contribution.role + "_remind_1"
    elsif contribution.status == 'remind1'
      template_name = contribution.role + "_remind_2"
    else
      # error
    end
    template = company.contribution_emails.where(name:template_name).take
    contribution_url = "http://#{ENV['HOST_NAME']}/contributions/#{contribution.id}/contribution"
    feedback_url = "http://#{ENV['HOST_NAME']}/contributions/#{contribution.id}/feedback"
    opt_out_url = "http://#{ENV['HOST_NAME']}/contributions/#{contribution.id}/opt_out"
    subject = template.subject
                      .sub("[customer_name]", contribution.success.customer.name)
                      .sub("[company_name]", company.name)
    @body = template.body
                    .sub("[contributor_first_name]", contribution.user.first_name)
                    .sub("[contribution_url]", contribution_url)
                    .sub("[feedback_url]", feedback_url)
                    .sub("[opt_out_url]", opt_out_url)
                    .html_safe

    if ['***REMOVED***', '***REMOVED***'].include? contributor.email
      mail     to: "#{contributor.full_name} <#{contributor.email}>",
             from: "#{curator.full_name} <#{curator.email}>",
          subject: subject
    else
      mail     to: "Ryan Wilson <***REMOVED***>",
             from: "#{curator.full_name} <#{curator.email}>",
          subject: subject
    end

  end # contribution_reminder

end


