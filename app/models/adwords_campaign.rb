class AdwordsCampaign < ActiveRecord::Base

  belongs_to :company
  has_one :adwords_ad_group, dependent: :destroy
  alias_attribute :ad_group, :adwords_ad_group

end
