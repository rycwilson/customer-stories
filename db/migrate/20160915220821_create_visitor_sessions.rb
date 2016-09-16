class CreateVisitorSessions < ActiveRecord::Migration
  def change
    create_table :visitor_sessions do |t|
      t.datetime :timestamp
      t.string :referrer_type
      t.references :visitor, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
