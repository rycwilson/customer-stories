class AdwordsImage < ApplicationRecord

  attr_accessor :is_default_card  # for distinguishing default (static) image cards from dynamic

  belongs_to :company
  has_many :adwords_ads_images, dependent: :destroy
  has_many :adwords_ads, through: :adwords_ads_images
  alias_attribute :ads, :adwords_ads
  has_many :stories, through: :adwords_ads

  validates_presence_of :company  # https://launchacademy.com/blog/validating-associations-in-rails
  # validates_presence_of :type, # SquareLogo, LandscapeLogo, SquareImage, LandscapeImage
  # validates_presence_of :image_url  # check for specific format (csp or maybe google)
  
  # upload to gads regardless of company.promote_tr
  # validates_presence_of :asset_id
  # before_validation :upload_to_google, on: :create

  # https://medium.com/appaloosa-store-engineering/caution-when-using-before-destroy-with-model-association-71600b8bfed2
  before_destroy :update_ads, prepend: true, if: :promote_enabled?

  after_destroy_commit { S3Util::delete_object(S3_BUCKET, self.image_url) }

  private

  def promote_enabled?
    self.company.promote_tr?
  end

  def upload_to_google
    # GoogleAds::upload_image_asset(self)
  end

  def update_ads
    # only required images need to be replaced => SquareImage or LandscapeImage
    # don't just refer to self.ads here, or ads will be assigned by reference and will
    # empty once images have been disassociated
    ads = AdwordsAd.find(self.ads.map { |ad| ad.id })
    self.ads.each do |ad|
      ad.images.delete(self)
      if ad.square_images.blank?
        ad.images << ad.company.adwords_images.square_images.default.take
      elsif ad.landscape_images.blank?
        ad.images << ad.company.adwords_images.landscape_images.default.take
      end
    end
    # GoogleAds::update_ads(ads)
  end

end
