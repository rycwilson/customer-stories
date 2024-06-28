class ContributorInvitation < ApplicationRecord
  belongs_to :contribution
  has_one :sender, through: :contribution, source: :curator
  has_one :recipient, through: :contribution, source: :contributor

  enum status: { pending: 0, sent: 1 }

  def populate_template
    email_subject = contribution.invitation_template.request_subject
      .gsub('[customer_name]', contribution.customer.name)
      .gsub('[company_name]', contribution.company.name)
      .gsub('[contributor_first_name]', contribution.contributor.first_name)
      .gsub('[contributor_full_name]', contribution.contributor.full_name)
    email_body = contribution.invitation_template.request_body
      .gsub('[customer_name]', contribution.customer.name)
      .gsub('[company_name]', contribution.company.name)
      .gsub('[contributor_first_name]', contribution.contributor.first_name)
      .gsub('[contributor_full_name]', contribution.contributor.full_name)
      .gsub('[referrer_full_name]', contribution.referrer.try(:full_name) || '<span style="color:#D9534F">Unknown Referrer</span>')
      .gsub('[curator_full_name]', "<span style='font-weight:bold'>#{contribution.curator.full_name}</span>")
      .gsub('[curator_phone]', contribution.curator.phone || '')
      .gsub('[curator_title]', contribution.curator.title || '')
      .gsub('[curator_img_url]', contribution.curator.photo_url || '')
      .gsub('[contribution_submission_url]', contribution.invitation_link('contribution'))
      .gsub('[feedback_submission_url]', contribution.invitation_link('feedback'))
      .html_safe
  end
end
