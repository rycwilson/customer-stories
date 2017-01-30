class CreateVisitorActions < ActiveRecord::Migration
  def change
    create_table :visitor_actions do |t|
      t.string :type
      t.references :success, index: true, foreign_key: true
      t.references :visitor_session, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
