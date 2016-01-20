class CreateInvitedCurators < ActiveRecord::Migration
  def change
    create_table :invited_curators do |t|
      t.string :email
      t.references :company, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
