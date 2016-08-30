class AddRequestReceivedAtToContributions < ActiveRecord::Migration
  def change
    add_column :contributions, :request_received_at, :datetime
  end
end
