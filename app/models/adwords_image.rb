class AdwordsImage < ActiveRecord::Base

  belongs_to :company
  has_many :sponsored_stories_images, dependent: :destroy
  has_many :stories, through: :sponsories_images

  before_destroy :s3_delete

  def s3_delete
    S3_BUCKET.delete_objects(
      delete: {
        objects: [
          key: self.image_url[/.com\/(.+)/, 1]
        ]
      }
    ) unless !self.image_url.is_a?(String)
  end

end
