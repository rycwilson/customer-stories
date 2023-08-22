
class AdwordsAd < ApplicationRecord
  belongs_to :story
  belongs_to :adwords_ad_group
  alias_attribute :ad_group, :adwords_ad_group
  has_one :adwords_campaign, through: :adwords_ad_group
  alias_attribute :campaign, :adwords_campaign
  has_one :company, through: :adwords_campaign
  has_many :adwords_ads_images, dependent: :destroy
  has_many(
    :adwords_images,
    through: :adwords_ads_images,
    after_add: :clear_promoted_stories_cache,
    after_remove: :clear_promoted_stories_cache
  ) { def default; where(default: true); end }
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
  before_destroy :remove_gad, if: :promote_enabled?

  # after_commit :clear_promoted_stories_cache, on: [:create, :update, :destroy]

  def google_ad
    campaign_type = self.ad_group.campaign.type.match('Topic') ? 'topic' : 'retarget'
    default_images = self.story.company.adwords_images.default
    square_images = (self.new_record? ? default_images.square_images : self.square_images).to_a
    landscape_images = (self.new_record? ? default_images.landscape_images : self.landscape_images).to_a
    square_logos = (self.new_record? ? default_images.square_logos : self.square_logos).to_a
    landscape_logos = (self.new_record? ? default_images.landscape_logos : self.landscape_logos).to_a
    [square_images, landscape_images, square_logos, landscape_logos].each do |images|
      images.map! do |image|
        {
          asset: {
            xsi_type: 'ImageAsset',
            asset_id: image.asset_id
          }
        }
      end
    end
    {
      xsi_type: 'MultiAssetResponsiveDisplayAd',
      headlines: [
        {
          asset: {
            xsi_type: 'TextAsset',
            asset_text: self.story.company.adwords_short_headline  # get company via story in case ad is new record
          }
        }
      ],
      descriptions: [
        {
          asset: {
            xsi_type: 'TextAsset',
            asset_text: self.long_headline
          }
        },
      ],
      business_name: self.story.company.name,
      long_headline: {
        asset: {
          xsi_type: 'TextAsset',
          asset_text: self.long_headline
        }
      },
      # the association methods (e.g. ad.landscape_images) don't work here
      # because the ad hasn't been saved yet
      marketing_images: landscape_images,
      square_marketing_images: square_images,
      final_urls: [
        self.story.csp_story_url + "?utm_campaign=promote&utm_content=#{ campaign_type }"
      ],
      call_to_action_text: 'See More',
      # main_color: self.main_color,
      # accent_color: self.accent_color,
      allow_flexible_color: true,
      # https://developers.google.com/adwords/api/docs/reference/v201809/AdGroupAdService.ResponsiveDisplayAd#formatsetting
      format_setting: 'ALL_FORMATS',  # 'NATIVE', 'NON_NATIVE'
      # dynamic_settings_price_prefix: 'as low as',
      # dynamic_settings_promo_text: 'Free shipping!',
      logo_images: square_logos,
      landscape_logo_images: landscape_logos
    }
  end

  private

  def promote_enabled?
    self.campaign.company.promote_tr?
  end

  def create_gad
    # new_gad = GoogleAds::create_ad(self)
    # if new_gad[:id].present?
    #   self[:ad_id] = new_gad[:id]
    # else
      # don't want to trigger invalidation because we want the model even if the ad fails
      # the failure can be ignored when updating the story (publishing, unpublishing),
      # and flagged in the promoted stories table

      # this doesn't seem to work
    #   new_gad[:errors].each { |error| self.story.errors[:base] << google_error(error) }
    # end
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
    # GoogleAds::remove_ads([ { ad_group_id: self.ad_group.ad_group_id, ad_id: self.ad_id } ])
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

  # after_add and after_remove callbacks will pass the AdwordsImage object
  def clear_promoted_stories_cache(image=nil)
    # reference the company through the story for newly created ads
    # Rails.cache.clear("#{self.story.company.subdomain}/promoted-stories")
  end

end
