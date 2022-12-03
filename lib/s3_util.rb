module S3Util
  class << self 
    def delete_object(bucket, object_url)
      key = object_url.match(/(amazonaws\.com|cloudfront\.net)\/(.*)/).try(:[], 2)
      if key
        bucket.delete_objects({
          delete: { 
            objects: [{ key: key }] 
          }
        })
      end
    end
  end
end
