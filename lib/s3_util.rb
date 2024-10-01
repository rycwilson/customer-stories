module S3Util
  class << self 
    # delete from csp-dev-assets bucket OR from .net production environment
    # do not delete from csp-prod-assets bucket except from .net production environment
    def delete_object(bucket, object_url)
      key = object_url.match(/(amazonaws\.com|cloudfront\.net)\/(.*)/).try(:[], 2)
      if key && (object_url.include?('csp-dev-assets') || ENV['HOST_NAME'].include?('.net'))
        bucket.delete_objects({
          delete: { 
            objects: [{ key: }] 
          }
        })
      end
    end
  end
end
