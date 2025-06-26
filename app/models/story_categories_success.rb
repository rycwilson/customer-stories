# frozen_string_literal: true

# NOTE: this file is ignored because the relationship is defined with `has_and_belongs_to_many`
# TODO: Add a custom validation to the Success model to ensure any tags belong to the same company
class StoryCategoriesSuccess < ApplicationRecord
  belongs_to :story_category
  belongs_to :success

  validates_presence_of :story_category_id, :success_id
  validates_uniqueness_of :story_category_id, scope: :success_id
  validates_uniqueness_of :success_id, scope: :story_category_id

  validate :same_company

  private

  def same_company
    return if story_category.company == success.company

    errors.add(:base, 'Customer Win and Category Tag must belong to the same Company')
  end
end
