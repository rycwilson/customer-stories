module S3Util
  class << self 
    def delete_object(bucket, object_url)
      key = object_url.match(/(amazonaws\.com|cloudfront\.net)\/(.*)/).try(:[], 2)
      return unless key.present?

      # Do not delete from csp-prod-assets bucket unless in .net production environment
      if object_url.match(/csp-(dev-assets|staging-assets)/) or ENV['HOST_NAME'] == 'customerstories.net'
        puts "\n\n\nDeleting object: #{key} from bucket: #{bucket.name}\n\n\n"
        res = bucket.delete_objects({
          delete: { 
            objects: [{ key: }] 
          }
        })
      end
    end
  end
end
