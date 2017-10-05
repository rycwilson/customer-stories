class AddRequestSentAtToContributions < ActiveRecord::Migration

  def change
    add_column :contributions, :request_sent_at, :datetime
    rename_column :contributions, :remind_1_wait, :first_reminder_wait
    rename_column :contributions, :remind_2_wait, :second_reminder_wait
  end

end
