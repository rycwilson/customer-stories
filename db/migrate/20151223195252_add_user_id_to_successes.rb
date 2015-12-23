class AddUserIdToSuccesses < ActiveRecord::Migration
  def change
    add_reference :successes, :user, index: true, foreign_key: true
  end
end
