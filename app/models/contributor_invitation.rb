# frozen_string_literal: true

class ContributorInvitation < ApplicationRecord
  # Since this table was added before Rails 5 (when belongs_to associations became required),
  # the contribution_id column is presently nullable and so we need to explicitly require
  # the association
  # TODO: enforce this in the database schema
  belongs_to :contribution
  validates :contribution, presence: true

  has_one :sender, through: :contribution, source: :curator
  has_one :recipient, through: :contribution, source: :contributor

  enum status: %i[pending sent]

  def populate_template
    populate_email_subject
    populate_email_body
    self
  end

  private

  def populate_email_subject
    self.email_subject =
      contribution.invitation_template.request_subject
                  .gsub('[customer_name]', contribution.customer.name)
                  .gsub('[company_name]', contribution.company.name)
                  .gsub('[contributor_first_name]', contribution.contributor.first_name)
                  .gsub('[contributor_full_name]', contribution.contributor.full_name)
  end

  def populate_email_body
    self.email_body =
      contribution.invitation_template.request_body
                  .gsub('[customer_name]', contribution.customer.name)
                  .gsub('[company_name]', contribution.company.name)
                  .gsub('[contributor_first_name]', contribution.contributor.first_name)
                  .gsub('[contributor_full_name]', contribution.contributor.full_name)
                  .gsub(
                    '[referrer_full_name]',
                    contribution.referrer.try(:full_name) || '<span style="color:#D9534F">Unknown Referrer</span>'
                  )
                  .gsub(
                    '[curator_full_name]',
                    "<span style='font-weight:bold'>#{contribution.curator.full_name}</span>"
                  )
                  .gsub('[curator_phone]', contribution.curator.phone || '')
                  .gsub('[curator_title]', contribution.curator.title || '')
                  .gsub('[curator_img_url]', contribution.curator.photo_url || '')
                  .gsub('[contribution_submission_url]', contribution.invitation_link('contribution'))
                  .gsub('[feedback_submission_url]', contribution.invitation_link('feedback'))
  end
end
