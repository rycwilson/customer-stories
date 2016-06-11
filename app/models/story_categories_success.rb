class StoryCategoriesSuccess < ActiveRecord::Base
  belongs_to :story_category
  belongs_to :success
end
