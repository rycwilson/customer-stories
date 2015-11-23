class AddPublishDateToSuccesses < ActiveRecord::Migration
  def change
    add_column :successes, :publish_date, :datetime
  end
end
