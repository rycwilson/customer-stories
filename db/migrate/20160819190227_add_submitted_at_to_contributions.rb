class AddSubmittedAtToContributions < ActiveRecord::Migration
  def change
    add_column :contributions, :submitted_at, :datetime
  end
end
