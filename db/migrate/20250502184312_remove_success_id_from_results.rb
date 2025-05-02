class RemoveSuccessIdFromResults < ActiveRecord::Migration[6.1]
  def change
    remove_reference :results, :success, foreign_key: true
  end
end
