class CreateContributions < ActiveRecord::Migration
  def change
    create_table :contributions do |t|
      t.references :user, index: true, foreign_key: true
      t.references :success, index: true, foreign_key: true
      t.string :role
      t.text :contribution
      t.text :feedback
      t.string :state
      t.boolean :linkedin_auth?
      t.boolean :opt_out?

      t.timestamps null: false
    end
  end
end
