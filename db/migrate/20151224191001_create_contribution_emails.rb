class CreateContributionEmails < ActiveRecord::Migration
  def change
    create_table :contribution_emails do |t|
      t.string :name
      t.string :subject
      t.text :body
      t.references :company, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
