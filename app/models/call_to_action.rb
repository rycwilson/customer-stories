class CallToAction < ApplicationRecord
  belongs_to :company
  has_and_belongs_to_many :successes, join_table: 'ctas_successes'
  has_many :stories, through: :successes
  accepts_nested_attributes_for(
    :company, 
    reject_if: -> (attrs) { !attrs.keys.all? { |attr| attr.match(/(\Aid\z)|primary_cta/) } }
  )
  scope :secondary, -> { where(primary: false) }
end
