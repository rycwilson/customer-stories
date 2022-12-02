module S3Util
  class << self 
    def delete_object(bucket, object_url)
      # unless !object_url.is_a?(String) || !object_url.include?('https')
      #   bucket.delete_objects({
      #     delete: { objects: [{ key: object_url[/.com\/(.+)/, 1] }] }
      #   })
      # end
    end
  end
end
