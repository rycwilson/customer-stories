class CreateEmailContributionRequests < ActiveRecord::Migration
  def change
    create_table :email_contribution_requests do |t|
      t.references :contribution, index: true, foreign_key: true
      t.string :name
      t.string :subject
      t.string :body

      t.timestamps null: false
    end
  end
end
