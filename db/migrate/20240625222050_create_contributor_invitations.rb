class CreateContributorInvitations < ActiveRecord::Migration[6.1]
  def change
    create_table :contributor_invitations do |t|
      t.text :email_subject
      t.text :email_body
      t.datetime :sent_at
      t.references :contribution_id, foreign_key: true

      t.timestamps
    end
  end
end
