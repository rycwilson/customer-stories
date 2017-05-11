class AdwordsImage < ActiveRecord::Base

  belongs_to :company
  has_many :adwords_ads_images, dependent: :destroy
  has_many :adwords_ads, through: :adwords_ads_images
  alias_attribute :ads, :adwords_ads

  before_destroy :s3_delete

  def s3_delete
    S3_BUCKET.delete_objects(
      delete: {
        objects: [
          key: self.image_url[/.com\/(.+)/, 1]
        ]
      }
    ) unless !self.image_url.is_a?(String) || !self.image_url.include?('https')
  end

end
