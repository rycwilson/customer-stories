class CallToAction < ApplicationRecord
  belongs_to :company
  has_and_belongs_to_many :successes, join_table: 'ctas_successes'
  has_many :stories, through: :successes
end
