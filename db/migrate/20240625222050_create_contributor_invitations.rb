class CreateContributorInvitations < ActiveRecord::Migration[6.1]
  def change
    create_table :contributor_invitations do |t|
      t.text :email_subject
      t.text :email_body
      t.integer :status, default: 0
      t.datetime :sent_at
      t.references :contribution, index: true, foreign_key: true

      t.timestamps
    end
  end
end
