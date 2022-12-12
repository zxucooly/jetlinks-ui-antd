import type { TermsType, TermsVale } from '@/pages/rule-engine/Scene/typings';
import { DropdownButton, ParamsDropdown } from '@/pages/rule-engine/Scene/Save/components/Buttons';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { useEffect, useState, useCallback, useRef } from 'react';
import classNames from 'classnames';
import { observer } from '@formily/react';
import { Popconfirm, Space } from 'antd';
import './index.less';

interface FilterProps {
  branchesName: number;
  branchGroup?: number;
  action?: number;
  data: TermsType;
  isLast: boolean;
  onChange: (value: TermsType) => void;
  onLabelChange: (lb: any[]) => void;
  options: any[];
  label?: any[];
  onAdd: () => void;
  onDelete: () => void;
}

const handleName = (_data: any) => (
  <Space>
    {_data.name}
    {/*<div style={{ color: 'grey', marginLeft: '5px' }}>{_data.fullName}</div>*/}
    {_data.description && (
      <div style={{ color: 'grey', marginLeft: '5px' }}>({_data.description})</div>
    )}
  </Space>
);

const DoubleFilter = ['nbtw', 'btw', 'in', 'nin'];
const columnOptionsMap = new Map<string, any>();
export default observer((props: FilterProps) => {
  const [value, setValue] = useState<Partial<TermsVale> | undefined>({});
  const [termType, setTermType] = useState('');
  const [column, setColumn] = useState('');

  const [BuiltInOptions, setBuiltInOptions] = useState<any[]>([]);
  const [columnOptions, setColumnOptions] = useState<any[]>([]);
  const [ttOptions, setTtOptions] = useState<any>([]);
  const [valueOptions] = useState<any[]>([]);
  const [valueType, setValueType] = useState('');
  const labelCache = useRef<any[]>([undefined, undefined, {}, 'and']);

  const [deleteVisible, setDeleteVisible] = useState(false);

  const ValueRef = useRef<Partial<TermsType>>({
    column: '',
    termType: '',
    value: undefined,
  });

  const valueChange = useCallback(
    (_value: any) => {
      props.onChange?.({ ..._value });
    },
    [column, termType, value],
  );

  const valueEventChange = useCallback(
    (_v: any) => {
      valueChange({
        column: ValueRef.current.column,
        termType: ValueRef.current.termType,
        value: _v,
      });
    },
    [column, termType],
  );

  const convertLabelValue = (columnValue?: string) => {
    if (columnValue) {
      const labelOptions = columnOptionsMap.get(columnValue);
      if (!labelOptions) return;

      const _termTypeOptions: any[] =
        labelOptions?.termTypes?.map((tItem: any) => ({ title: tItem.name, key: tItem.id })) || [];
      setTtOptions(_termTypeOptions);
      setValueType(labelOptions?.type);
    }
  };

  const handleTreeData = (data: any): any[] => {
    if (data.length > 0) {
      return data.map((item: any) => {
        const name = handleName(item);
        columnOptionsMap.set(item.id || item.column, item);
        if (item.children) {
          return {
            ...item,
            key: item.id,
            fullName: item.name,
            title: name,
            disabled: true,
            children: handleTreeData(item.children),
          };
        }
        return { ...item, key: item.id, fullName: item.name, title: name };
      });
    }
    return [];
  };

  useEffect(() => {
    if (props.data) {
      setColumn(props.data.column || '');
      setTermType(props.data.termType || '');
      setValue(props.data.value);
      ValueRef.current = props.data || {};
      handleTreeData(props.options || []);
      convertLabelValue(props.data.column);
    }
  }, [props.data]);

  useEffect(() => {
    const newOptions = handleTreeData(props.options || []);
    convertLabelValue(props.data?.column);
    setBuiltInOptions(newOptions);
    setColumnOptions(newOptions);
  }, [props.options]);

  useEffect(() => {
    labelCache.current = props.label || [undefined, undefined, {}, 'and'];
  }, [props.label]);

  return (
    <div className="filter-condition-warp">
      <div
        className="filter-condition-content"
        onMouseOver={() => {
          setDeleteVisible(true);
        }}
        onMouseOut={() => {
          setDeleteVisible(false);
        }}
      >
        <Popconfirm title={'确认删除？'} onConfirm={props.onDelete}>
          <div className={classNames('filter-condition-delete', { show: deleteVisible })}>
            <CloseOutlined />
          </div>
        </Popconfirm>
        <DropdownButton
          options={columnOptions}
          type="param"
          placeholder="请选择参数"
          value={column}
          showLabelKey="fullName"
          isTree={true}
          onChange={(_value, item) => {
            setValue({
              value: undefined,
              source: 'fixed',
            });
            // paramChange(item);
            setColumn(_value!);
            const node = item.node;
            const _termTypeOptions: any[] =
              node.termTypes?.map((tItem: any) => ({ title: tItem.name, key: tItem.id })) || [];
            setTtOptions(_termTypeOptions);
            // 默认选中第一个
            let _termTypeValue = undefined;
            if (_termTypeOptions.length) {
              _termTypeValue = _termTypeOptions[0].key;
              labelCache.current[1] = _termTypeValue;
              setTermType(_termTypeValue);
            } else {
              labelCache.current[1] = '';
              setTermType('');
            }
            ValueRef.current.column = _value!;
            labelCache.current[0] = node.fullName;
            valueChange({
              column: _value,
              value: {
                value: undefined,
                source: 'fixed',
              },
              termType: _termTypeValue,
            });
          }}
        />
        <DropdownButton
          options={ttOptions}
          type="termType"
          placeholder="操作符"
          value={termType}
          onChange={(v) => {
            const _value = {
              ...value,
            };
            if (value && DoubleFilter.includes(v!)) {
              _value.value = [undefined, undefined];
            } else {
              _value.value = undefined;
            }
            setValue(_value);
            setTermType(v!);

            labelCache.current[1] = v;
            ValueRef.current.termType = v;
            valueChange({
              column: props.data!.column,
              value: _value as TermsVale,
              termType: v,
            });
          }}
        />
        {DoubleFilter.includes(termType) ? (
          <>
            <ParamsDropdown
              options={valueOptions}
              type="value"
              placeholder="参数值"
              valueType={valueType}
              value={value}
              BuiltInOptions={BuiltInOptions}
              showLabelKey="fullName"
              name={0}
              onChange={(v, lb) => {
                const _myValue = {
                  value: [v.value, ValueRef.current.value?.value?.[1]],
                  source: v.source,
                };
                ValueRef.current.value = _myValue;
                setValue(_myValue);
                labelCache.current[2] = { ...labelCache.current[2], 0: lb };
                labelCache.current[3] = props.data.type;
                props.onLabelChange?.(labelCache.current);
                valueEventChange(_myValue);
              }}
            />
            <ParamsDropdown
              options={valueOptions}
              type="value"
              placeholder="参数值"
              valueType={valueType}
              value={value}
              BuiltInOptions={BuiltInOptions}
              showLabelKey="fullName"
              name={1}
              onChange={(v, lb) => {
                const _myValue = {
                  value: [ValueRef.current.value?.value?.[0], v.value],
                  source: v.source,
                };
                ValueRef.current.value = _myValue;
                setValue(_myValue);
                labelCache.current[2] = { ...labelCache.current[2], 1: lb };
                labelCache.current[3] = props.data.type;
                props.onLabelChange?.(labelCache.current);
                valueEventChange(_myValue);
              }}
            />
          </>
        ) : (
          <ParamsDropdown
            options={valueOptions}
            type="value"
            placeholder="参数值"
            valueType={valueType}
            value={value}
            BuiltInOptions={BuiltInOptions}
            showLabelKey="fullName"
            onChange={(v, lb) => {
              setValue({
                ...v,
              });
              labelCache.current[2] = { 0: lb };
              labelCache.current[3] = props.data.type;
              props.onLabelChange?.(labelCache.current);
              valueEventChange(v);
            }}
          />
        )}
      </div>
      {!props.isLast ? (
        <div className="term-type-warp">
          <DropdownButton
            options={[
              { title: '并且', key: 'and' },
              { title: '或者', key: 'or' },
            ]}
            isTree={false}
            type="type"
            value={props.data.type}
            onChange={(v) => {
              props.data.type = v;
              labelCache.current[3] = v;
              props.onLabelChange?.([...labelCache.current]);
            }}
          />
        </div>
      ) : (
        <div className="terms-filter-add" onClick={props.onAdd}>
          <div className="terms-filter-content">
            <PlusOutlined style={{ fontSize: 12, paddingRight: 4 }} />
            <span>条件</span>
          </div>
        </div>
      )}
    </div>
  );
});
