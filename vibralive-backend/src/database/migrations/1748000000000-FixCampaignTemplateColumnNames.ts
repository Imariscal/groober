import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migration: Fix Campaign Template Column Names
 * 
 * Rename camelCase column names to snake_case if they exist:
 * - bodyHtml → body_html
 * - previewText → preview_text
 * 
 * Date: March 9, 2026
 */
export class FixCampaignTemplateColumnNames1748000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const campaignTemplatesTable = await queryRunner.getTable('campaign_templates');
    if (!campaignTemplatesTable) {
      console.log('⚠️  campaign_templates table does not exist, skipping migration');
      return;
    }

    // Fix bodyHtml → body_html
    const bodyHtmlColumn = campaignTemplatesTable?.findColumnByName('bodyHtml');
    if (bodyHtmlColumn) {
      console.log('🔄 Renaming bodyHtml → body_html');
      await queryRunner.renameColumn('campaign_templates', 'bodyHtml', 'body_html');
    } else {
      console.log('✅ body_html column already exists correctly');
    }

    // Fix previewText → preview_text
    const previewTextColumn = campaignTemplatesTable?.findColumnByName('previewText');
    if (previewTextColumn) {
      console.log('🔄 Renaming previewText → preview_text');
      await queryRunner.renameColumn('campaign_templates', 'previewText', 'preview_text');
    } else {
      console.log('✅ preview_text column already exists correctly');
    }

    console.log('✨ Campaign template column names fixed');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const campaignTemplatesTable = await queryRunner.getTable('campaign_templates');
    if (!campaignTemplatesTable) {
      return;
    }

    // Reverse: body_html → bodyHtml
    const bodyHtmlColumn = campaignTemplatesTable?.findColumnByName('body_html');
    if (bodyHtmlColumn) {
      await queryRunner.renameColumn('campaign_templates', 'body_html', 'bodyHtml');
    }

    // Reverse: preview_text → previewText
    const previewTextColumn = campaignTemplatesTable?.findColumnByName('preview_text');
    if (previewTextColumn) {
      await queryRunner.renameColumn('campaign_templates', 'preview_text', 'previewText');
    }
  }
}
