class AdwordsImage < ActiveRecord::Base

  belongs_to :company
  has_many :adwords_ads_images, dependent: :destroy
  has_many :adwords_ads, through: :adwords_ads_images
  alias_attribute :ads, :adwords_ads
  has_many :stories, through: :adwords_ads

  before_destroy(:s3_delete) if ENV['HOST_NAME'] == 'customerstories.net'

  # don't delete these default adwords images; may be used to seed adwords
  NO_DELETE = [
    "https://csp-production-assets.s3-us-west-1.amazonaws.com/uploads/1f398239-e32f-4ae6-b3d1-224dbde4b9e6/retailnext_landscape_1.png",
    "https://csp-production-assets.s3-us-west-1.amazonaws.com/uploads/488cc685-1be1-420f-b111-20e8e8ade5a0/varmour-existing.jpeg",
    "https://csp-production-assets.s3-us-west-1.amazonaws.com/uploads/413d1bfd-a71d-4f11-9af2-0cd886fadaba/acme_landscape.png"
  ]

  def s3_delete ()
    S3_BUCKET.delete_objects(
      delete: {
        objects: [
          key: self.image_url[/.com\/(.+)/, 1]
        ]
      }
    ) unless (
      !self.image_url.is_a?(String) || !self.image_url.include?('https') ||
      NO_DELETE.include?(self.image_url)
    )
  end

end
