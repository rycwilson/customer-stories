module S3Util
  class << self 
    def delete_object(bucket, object_url)
      key = object_url.match(/(amazonaws\.com|cloudfront\.net)\/(.*)/).try(:[], 2)
      return unless key.present?

      # Without hardcoding the distribution name, we have no way of knowing if object_url resides in csp-staging-assets or csp-prod-assets.
      # We want to avoid deleting objects from csp-prod-assets unless we are in the customerstories.net environment,
      # this because the production db may have been copied to staging or development, including uploaded object links.
      # The csp-dev-assets bucket is not behind a distribution, so we can identify those objects as development and delete them.
      # => allow deletion of images residing in csp-dev-assets bucket
      # => otherwise only allow deletion if in the customerstories.net environment
      # TODO This means objects updated in the staging environment will not be automatically deleted. Need a cleanup task.

      if object_url.include?('csp-dev-assets') or ENV['HOST_NAME'] == 'customerstories.net'
        res = bucket.delete_objects({
          delete: { 
            objects: [{ key: }] 
          }
        })
      end
    end
  end
end
