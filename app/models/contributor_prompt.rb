class ContributorPrompt < ApplicationRecord
  belongs_to :company
  has_and_belongs_to_many :invitation_templates, dependent: :destroy
  has_and_belongs_to_many :story_categories, dependent: :destroy
  has_and_belongs_to_many :products, dependent: :destroy
end
