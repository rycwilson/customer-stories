# frozen_string_literal: true

class AdwordsCampaign < ApplicationRecord
  belongs_to :company
  has_one :adwords_ad_group, dependent: :destroy
  alias_method :ad_group, :adwords_ad_group
  has_many :adwords_ads, through: :adwords_ad_group
  alias_method :ads, :adwords_ads

  # TODO: This approach might be outdated
  # https://stackoverflow.com/questions/3808782#answer-3809360
  before_create :build_default_ad_group

  private

  def build_default_ad_group
    # Build default ad group instance. Will use default params.
    # The foreign key to the owning AdwordsCampaign model is set automatically
    build_adwords_ad_group name: "#{company.subdomain} ad group display #{type}"

    # Always return true in callbacks as the normal 'continue' state
    # assumes that the default_ad group can always be created.
    # or
    # Check the validation of the ad group. If it is not valid, then
    # return false from the callback. Best to use a before_validation
    # if doing this. View code should check the errors of the child.
    # Or add the child's errors to the User model's error array of the :base
    # error item
    true
  end
end
