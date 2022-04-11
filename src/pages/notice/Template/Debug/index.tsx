import { Button, Modal } from 'antd';
import { useEffect, useMemo } from 'react';
import { createForm, Field, onFieldReact, onFieldValueChange } from '@formily/core';
import { createSchemaField, observer } from '@formily/react';
import {
  ArrayTable,
  DatePicker,
  Form,
  FormItem,
  Input,
  NumberPicker,
  PreviewText,
  Select,
} from '@formily/antd';
import { ISchema } from '@formily/json-schema';
import { configService, state } from '@/pages/notice/Template';
import { useLocation } from 'umi';
import { useAsyncDataSource } from '@/utils/util';
import { Store } from 'jetlinks-store';
import FUpload from '@/components/Upload';

const Debug = observer(() => {
  const location = useLocation<{ id: string }>();
  const id = (location as any).query?.id;

  const form = useMemo(
    () =>
      createForm({
        validateFirst: true,
        effects() {
          onFieldValueChange('configId', async (field, form1) => {
            const value = (field as Field).value;
            const configs = Store.get('notice-config');
            const target = configs.find((item: { id: any }) => item.id === value);
            console.log(target, 'target');
            // 从缓存中获取通知配置信息
            if (target && target.variableDefinitions) {
              form1.setValuesIn('variableDefinitions', target.variableDefinitions);
            }
            //
            // 获取 变量列表
            // 然后set 值
          });
          onFieldReact('variableDefinitions.*.type', (field) => {
            const value = (field as Field).value;
            const format = field.query('.value').take() as any;
            switch (value) {
              case 'date':
                format.setComponent(DatePicker);
                break;
              case 'string':
                format.setComponent(Input);
                break;
              case 'number':
                format.setComponent(NumberPicker);
                break;
              case 'file':
                format.setComponent(FUpload, {
                  type: 'file',
                });
                break;
              case 'other':
                format.setComponent(Input);
                break;
            }
          });
        },
      }),
    [id],
  );

  useEffect(() => {
    const data = state.current;
    form.setValuesIn('variableDefinitions', data?.variableDefinitions);
  });

  const SchemaField = createSchemaField({
    components: {
      FormItem,
      Input,
      Select,
      ArrayTable,
      PreviewText,
    },
  });

  const getConfig = () =>
    configService
      .queryNoPagingPost({
        terms: [{ column: 'type$IN', value: id }],
      })
      .then((resp: any) => {
        // 缓存通知配置
        Store.set('notice-config', resp.result);
        return resp.result?.map((item: { name: any; id: any }) => ({
          label: item.name,
          value: item.id,
        }));
      });

  const schema: ISchema = {
    type: 'object',
    properties: {
      configId: {
        title: '配置',
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        'x-reactions': '{{useAsyncDataSource(getConfig)}}',
      },
      variableDefinitions: {
        title: '变量',
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'ArrayTable',
        'x-component-props': {
          pagination: { pageSize: 9999 },
          scroll: { x: '100%' },
        },
        items: {
          type: 'object',
          properties: {
            column1: {
              type: 'void',
              'x-component': 'ArrayTable.Column',
              'x-component-props': { title: '变量', width: '120px' },
              properties: {
                id: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'PreviewText.Input',
                  'x-disabled': true,
                },
              },
            },
            column2: {
              type: 'void',
              'x-component': 'ArrayTable.Column',
              'x-component-props': { title: '名称', width: '120px' },
              properties: {
                name: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'PreviewText.Input',
                  'x-disabled': true,
                },
              },
            },
            column3: {
              type: 'void',
              'x-component': 'ArrayTable.Column',
              'x-component-props': { title: '值', width: '120px' },
              properties: {
                value: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                },
              },
            },
          },
        },
      },
    },
  };
  return (
    <Modal
      title="调试"
      width="40vw"
      visible={state.debug}
      onCancel={() => (state.debug = false)}
      footer={
        <Button type="primary" onClick={() => (state.debug = false)}>
          关闭
        </Button>
      }
    >
      <Form form={form} layout={'vertical'}>
        <SchemaField schema={schema} scope={{ getConfig, useAsyncDataSource }} />
      </Form>
    </Modal>
  );
});
export default Debug;