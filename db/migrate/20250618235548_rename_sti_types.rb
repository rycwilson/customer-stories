class RenameStiTypes < ActiveRecord::Migration[6.1]
  def up
    CallToAction.where(type: 'CTAForm').update_all(type: 'CtaForm')
    CallToAction.where(type: 'CTALink').update_all(type: 'CtaLink')
  end

  def down
    CallToAction.where(type: 'CtaForm').update_all(type: 'CTAForm')
    CallToAction.where(type: 'CtaLink').update_all(type: 'CTALink')
  end
end
