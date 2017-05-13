class AdwordsImage < ActiveRecord::Base

  belongs_to :company
  has_many :adwords_ads_images, dependent: :destroy
  has_many :adwords_ads, through: :adwords_ads_images
  alias_attribute :ads, :adwords_ads
  has_many :stories, through: :adwords_ads

  before_destroy :s3_delete

  NO_DELETE = ["https://csp-development-assets.s3-us-west-1.amazonaws.com/uploads/122dadec-7229-4d1c-a3fc-1e71e0ff9a16/varmour-existing.jpeg"]

  def s3_delete
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
