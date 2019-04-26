class AdwordsAd < ApplicationRecord
  belongs_to :story
  belongs_to :adwords_ad_group
  alias_attribute :ad_group, :adwords_ad_group
  has_one :adwords_campaign, through: :adwords_ad_group
  alias_attribute :campaign, :adwords_campaign
  has_one :company, through: :adwords_campaign
  has_many :adwords_ads_images, dependent: :destroy
  has_many(:adwords_images, through: :adwords_ads_images) { def default; where(default: true); end }
  alias_attribute :images, :adwords_images
  has_many(
    :marketing_images,
    -> { where(type: ['SquareImage', 'LandscapeImage']) },
    through: :adwords_ads_images,
    source: :adwords_image
  )
  has_many(
    :logos,
    -> { where(type: ['SquareLogo', 'LandscapeLogo']) },
    through: :adwords_ads_images,
    source: :adwords_image
  )
  has_many(
    :square_images,
    -> { where(type: 'SquareImage') },
    through: :adwords_ads_images,
    source: :adwords_image
  ) { def default; where(default: true); end }
  has_many(
    :landscape_images,
    -> { where(type: 'LandscapeImage') },
    through: :adwords_ads_images,
    source: :adwords_image
  ) { def default; where(default: true); end }
  has_many(
    :square_logos,
    -> { where(type: 'SquareLogo') },
    through: :adwords_ads_images,
    source: :adwords_image
  ) { def default; where(default: true); end }
  has_many(
    :landscape_logos,
    -> { where(type: 'LandscapeLogo') },
    through: :adwords_ads_images,
    source: :adwords_image
  ) { def default; where(default: true); end }

  validates_presence_of :story
  validates_presence_of :ad_group
  # validates_presence_of :square_images, if: :promote_enabled?
  # validates_presence_of :landscape_images, if: :promote_enabled?

  #
  # don't want to do this because we want the ad even if gads doesn't work
  # validates_presence_of(
  #   :ad_id,
  #   on: :create,
  #   if: Proc.new { |ad| ad.ad_group.campaign.company.promote_tr? }
  # )
  #
  # => throw an exception for this case
  #

  before_create :assign_defaults

  before_create :create_gad, if: :promote_enabled?

  # after_update_commit { GoogleAds::update_multi_asset_ad(self) }

  before_destroy :remove_gad, if: :promote_enabled?

  private

  def promote_enabled?
    self.campaign.company.promote_tr?
  end

  def create_gad
    new_gad = GoogleAds::create_ad(self, self.story.company.adwords_images.default)
    if new_gad[:ad].present?
      self[:ad_id] = new_gad[:ad][:id]
    else
      # don't want to trigger invalidation because we want the model even if the ad fails
      # the failure can be ignored when updating the story (publishing, unpublishing),
      # and flagged in the promoted stories table

      new_gad[:errors].each { |error| self.story.errors[:base] << google_error(error) }
    end
  end

  def validate_images
    # TODO: How best to do this?
    # => an ad can have up to 20 images
    # => scheduled maintenance
    # GoogleAds::get_image_assets(
    #       self.adwords_images.default.map { |image| image.asset_id }
    #     ).length == ?
  end

  def remove_gad
    GoogleAds::remove_ad(self.ad_group.ad_group_id, self.ad_id)
  end

  def assign_defaults
    self.long_headline = self.story.title.truncate(RESPONSIVE_AD_LONG_HEADLINE_MAX, { omission: '' })
    self.adwords_images << self.story.company.adwords_images.default
  end

  def google_error(error)
    case error[:type]
    when 'INVALID_ID'
      "Not found: #{ error[:field].underscore.humanize.downcase.singularize }"
    when 'REQUIRED'
      "Required: #{ error[:field].underscore.humanize.downcase.singularize }"
    # when something else
    else
    end
  end

end
