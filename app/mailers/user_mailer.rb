class UserMailer < ApplicationMailer

  default from: 'no-reply@customerstories.net'

  # TODO: How to handle errors/exceptions for sending email?
  def request_contribution contribution, contributor
    curator = contribution.success.curator
    story_example_id = Story.find_example
    host = "http://#{ENV['HOST_NAME']}"
    template_name = contribution.role + "_request"
    template = curator.company.contribution_emails.where(name:template_name).take
    @footer_img_url = "https://s3-us-west-1.amazonaws.com/csp-#{Rails.env}-assets/CS-powered-by.png"
    subject = template.subject
                .sub("[customer_name]", contribution.success.customer.name)
                .sub("[company_name]", curator.company.name)
    @body = template.body
              .sub("[customer_name]", contribution.success.customer.name)
              .sub("[company_name]", curator.company.name)
              .sub("[contributor_first_name]", contributor.first_name)
              .sub("[curator_first_name]", curator.first_name)
              .sub("[contribution_url]", "#{host}/contributions/#{contribution.id}/contribution")
              .sub("[feedback_url]", "#{host}/contributions/#{contribution.id}/feedback")
              .sub("[curator_full_name]", curator.full_name)
              .sub("[curator_company]", curator.company.name)
              .sub("[curator_email]", curator.email)
              .sub("[curator_phone]", "415-555-7256")
              .sub("[story_example_url]", "#{host}/stories/#{story_example_id}")
              .sub("[opt_out_url]", "#{host}/contributions/#{contribution.id}/opt_out")
              .sub("[curator_img_url]", curator.photo_url)
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
    contributor = contribution.user
    curator = contribution.success.curator
    host = "http://#{ENV['HOST_NAME']}"
    if contribution.status == 'request'
      template_name = contribution.role + "_remind_1"
    elsif contribution.status == 'remind1'
      template_name = contribution.role + "_remind_2"
    else
      # error
    end
    template = curator.company.contribution_emails.where(name:template_name).take
    @footer_img_url = "https://s3-us-west-1.amazonaws.com/csp-#{Rails.env}-assets/CS-powered-by.png"
    subject = template.subject
                .sub("[customer_name]", contribution.success.customer.name)
                .sub("[company_name]", curator.company.name)
    @body = template.body
              .sub("[contributor_first_name]", contribution.user.first_name)
              .sub("[contribution_url]", "#{host}/contributions/#{contribution.id}/contribution")
              .sub("[feedback_url]", "#{host}/contributions/#{contribution.id}/feedback")
              .sub("[opt_out_url]", "#{host}/contributions/#{contribution.id}/opt_out")
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


