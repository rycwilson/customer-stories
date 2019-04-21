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
  validates_presence_of :asset_id

  # upload to gads regardless of company.promote_tr
  before_validation :upload_to_gads, on: :create

  before_destroy(:s3_delete) if ENV['HOST_NAME'] == 'customerstories.net'

  before_destroy :replace_image_in_ads, if: :promote_enabled?

  # don't delete these default adwords images; may be used to seed adwords
  NO_DELETE = [
    "https://csp-production-assets.s3-us-west-1.amazonaws.com/uploads/1f398239-e32f-4ae6-b3d1-224dbde4b9e6/retailnext_landscape_1.png",
    "https://csp-production-assets.s3-us-west-1.amazonaws.com/uploads/488cc685-1be1-420f-b111-20e8e8ade5a0/varmour-existing.jpeg",
    "https://csp-production-assets.s3-us-west-1.amazonaws.com/uploads/413d1bfd-a71d-4f11-9af2-0cd886fadaba/acme_landscape.png"
  ]

  private

  def upload_to_gads
    GoogleAds::upload_image_asset(self)
  end

  def replace_image_in_ads
    # only required images need to be replaced => SquareImage or LandscapeImage
    # self.ads.each do |ad|
    #   # if ad.
    # end
  end


  def promote_enabled?
    self.company.promote_tr?
  end

  def s3_delete
    S3_BUCKET.delete_objects(
      delete: {
        objects: [
          key: self.image_url[/.com\/(.+)/, 1]
        ]
      }
    ) unless (
      !self.image_url.is_a?(String) ||
      !self.image_url.include?('https') ||
      NO_DELETE.include?(self.image_url)
    )
  end

end
