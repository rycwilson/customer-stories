class StoryCategoriesSuccess < ApplicationRecord
  belongs_to :story_category
  belongs_to :success

  validates_presence_of :story_category_id, :success_id
  validates_uniqueness_of :story_category_id, scope: :success_id
  validates_uniqueness_of :success_id, scope: :story_category_id

  validate :same_company

  private

  def same_company
    unless story_category.company == success.company
      errors.add(:base, "Story Category and Success must belong to the same Company")
    end
  end
end
