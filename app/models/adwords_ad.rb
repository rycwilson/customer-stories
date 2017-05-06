class AdwordsAd < ActiveRecord::Base

  belongs_to :adwords_ad_group
  alias_attribute :ad_group, :adwords_ad_group
  belongs_to :story

  def enabled?
    self.status == 'ENABLED'
  end

end
