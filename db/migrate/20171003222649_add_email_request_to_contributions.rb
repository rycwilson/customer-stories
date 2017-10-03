class AddEmailRequestToContributions < ActiveRecord::Migration
  def change
    add_column :contributions, :request_subject, :string
    add_column :contributions, :request_body, :text
  end
end
