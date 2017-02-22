class CallToAction < ActiveRecord::Base

  belongs_to :company
  has_many :ctas_successes, dependent: :destroy
  has_many :successes, through: :ctas_successes

end
